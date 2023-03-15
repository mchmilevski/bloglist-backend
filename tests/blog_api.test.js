const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')

const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

describe('there is initially some blogs saved', () => {
  test('blogs are returned as JSON', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const blogs = await helper.blogsInDb()
    expect(blogs).toHaveLength(helper.initialBlogs.length)
  })

  test('the unique identifier property of the blog posts is named id', async () => {
    const blogs = await helper.blogsInDb()
    expect(blogs[0].id).toBeDefined()
  })
})

describe('adding a new blog post', () => {
  test('succeeds with valid data', async () => {
    const newBlog = {
      title: 'Test Blog Post',
      author: 'Test',
      url: 'test',
      likes: 8
    }

    const token = await helper.loginAndGetAuthToken()
    await helper.createNewBlog(newBlog, 201, token)

    const blogsFromDb = await helper.blogsInDb()
    expect(blogsFromDb).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsFromDb.map(b => b.title)
    expect(titles).toContain(newBlog.title)

    const authors = blogsFromDb.map(b => b.author)
    expect(authors).toContain(newBlog.author)

    const urls = blogsFromDb.map(b => b.url)
    expect(urls).toContain(newBlog.url)

    const likes = blogsFromDb.map(b => b.likes)
    expect(likes).toContain(newBlog.likes)
  })

  test('fails with status code 401 Unauthorized if the token is not provided', async () => {
    const newBlog = {
      title: 'Test Blog Post',
      author: 'Test',
      url: 'test'
    }

    const result = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)

    expect(result.body.error).toContain('Unauthorized')
  })

  test('adding post with 0 likes if number of likes is not present', async () => {
    const newBlog = {
      title: 'Test Blog Post',
      author: 'Test',
      url: 'test'
    }

    const token = await helper.loginAndGetAuthToken()
    const createdBlog = await helper.createNewBlog(newBlog, 201, token)

    expect(createdBlog.body.likes).toEqual(0)
  })

  test('fails if title is missing', async () => {
    const newBlog = {
      author: 'Test',
      url: 'test'
    }

    const token = await helper.loginAndGetAuthToken()
    await helper.createNewBlog(newBlog, 400, token)

    const blogsFromDb = await helper.blogsInDb()
    expect(blogsFromDb).toHaveLength(helper.initialBlogs.length)
  })

  test('fails if url is missing', async () => {
    const newBlog = {
      title: 'Test',
      author: 'Test',
    }

    const token = await helper.loginAndGetAuthToken()
    await helper.createNewBlog(newBlog, 400, token)

    const blogsFromDb = await helper.blogsInDb()
    expect(blogsFromDb).toHaveLength(helper.initialBlogs.length)
  })
})

describe('deletion of a blog post', () => {
  test('succeeds with status 204 if id is valid', async () => {
    const newBlog = {
      title: 'Test Blog Post',
      author: 'Test',
      url: 'test',
      likes: 8
    }

    const token = await helper.loginAndGetAuthToken()
    const createdBlog = await helper.createNewBlog(newBlog, 201, token)

    const blogsAfterCreation = await helper.blogsInDb()
    expect(blogsAfterCreation).toHaveLength(helper.initialBlogs.length + 1)

    await api
      .delete(`/api/blogs/${createdBlog.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)


    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

    const titles = blogsAtEnd.map(b => b.titles)
    expect(titles).not.toContain(newBlog.title)
  })
})

describe('updating a blog post', () => {
  test('succeeds updating the likes number of a blog post', async () => {
    const newBlog = {
      title: 'Test Blog Post',
      author: 'Test',
      url: 'test',
      likes: 8
    }

    const token = await helper.loginAndGetAuthToken()
    const createdBlog = await helper.createNewBlog(newBlog, 201, token)

    const blogsAfterCreation = await helper.blogsInDb()
    expect(blogsAfterCreation).toHaveLength(helper.initialBlogs.length + 1)

    const updatedBlogLikes = createdBlog.body.likes + 1000

    await api
      .put(`/api/blogs/${createdBlog.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ likes: updatedBlogLikes })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const updatedBlog = await helper.getOneBlog(createdBlog.body.id)
    expect(updatedBlog.likes).toEqual(updatedBlogLikes)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
