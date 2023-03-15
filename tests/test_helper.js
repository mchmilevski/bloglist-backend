const supertest = require('supertest')

const Blog = require('../models/blog')
const User = require('../models/user')

const app = require('../app')
const api = supertest(app)

const initialBlogs = [
  {
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
  },
  {
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
  },
  {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
  },
]

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

const getOneBlog = async (id) => {
  const blog = await Blog.findById(id)
  return blog
}

const loginAndGetAuthToken = async () => {
  const user = {
    username: 'root',
    password: 'secret'
  }

  const loginResponse = await api
    .post('/api/login')
    .send(user)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  return loginResponse.body.token
}

const createNewBlog = async (blog, expectedStatusCode, token) => {
  const result = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(blog)
    .expect(expectedStatusCode)
    .expect('Content-Type', /application\/json/)

  return result
}

module.exports = {
  initialBlogs,
  blogsInDb,
  usersInDb,
  getOneBlog,
  loginAndGetAuthToken,
  createNewBlog
}