const { AuthenticationError } = require('apollo-server-express')
const { Book, User } = require('../models')
const { signToken } = require('../utils/auth')

// GraphQL Not working, how to remove book, queries in graphQl

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if(context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                .select('-__v -password')
                .populate('savedBooks');

                return userData;
            }

            throw new AuthenticationError('Not logged in')
        },
        users: async () => {
            return User.find()
            .select('-__v -password')
            .populate('savedBooks');
        },
        users: async (parent, { username }) => {
            return User.findOne({ username })
            .select('-__v -password')
            .populate('savedBooks');
        },
        books: async (parent, { username }) => {
            const params = username ? { username } : {};
            return Book.find(params)
        },
        book: async (parent, { bookId }) => {
            return Book.findOne({ bookId })
        }
    },

    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user}
        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw =await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token =signToken(user);
            return { token, user };
        },
        saveBook: async (parent, args, context) => {
            if(context.user) {
                const book = await Book.create({ ...args, username: context.user.username})
                await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $push: { books: book.bookId }},
                    { new: true }
                );
                return book;
            }
            throw new AuthenticationError('You need to be logged in!');
        },
        removeBook: async (parent, args, context) => {
            if(context.user) {
                const book = await Book.create({ ...args, username: context.user.username})
                await User.findByIdAndDelete(
                    { _id: context.user._id },
                    { $delete: { books: book.bookId }},
                    { new: true }
                );
            }
            throw new AuthenticationError('You need to be logged in!');
        },
    }
}


module.exports = resolvers;