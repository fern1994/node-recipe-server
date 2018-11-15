const express = require('express')

const mongoose = require('mongoose') // ใช้ติดต่อกับ DB mongo ใน mlab

const bodyParser = require('body-parser')

const cors = require('cors')

const jwt = require('jsonwebtoken')

require('dotenv').config({ path: 'variables.env' })

const Recipe = require('./models/Recipe') // model Recipe
const User = require('./models/User') // model User

// grapql middleware
const { graphiqlExpress, graphqlExpress } = require('apollo-server-express')
const { makeExecutableSchema } = require('graphql-tools')

const { typeDefs } = require('./schema')
const { resolvers } = require('./resolvers')

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

// ให้ connect db ด้วย URI ที่อยู่ในไฟล์ variable
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('DB connected'))
  .catch(err => console.error(err))

// ตั้งค่าเริ่มต้นของ app
const app = express()

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
}

app.use(cors(corsOptions))

// set JWT auth middleware
app.use(async (req, res, next) => {
  const token = req.headers['authorization']
  if (token !== 'null') {
    try {
      /* currentUser คือข้อมูล {
        username: 'jeff',
        email: 'jeff@mail.com',
        iat: 1537937223,
        exp: 1537940823
      }*/
      const currentUser = jwt.verify(token, process.env.SECRET)
      req.currentUser = currentUser
      console.error(currentUser)
    } catch (err) {
      console.error(err)
    }
  }
  next()
})

//สร้าง graphiql app
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))

// connect schema ด้วย graphql
app.use('/graphql',
  bodyParser.json(),
  graphqlExpress(
    ({ currentUser }) => ({
      schema,
      context: {
        Recipe,
        User,
        currentUser
      }
    })
  )
)

const PORT = process.env.PORT || 4444

app.listen(PORT, () => {
  console.log(`Server localhost listening on PORT ${PORT}`)
})