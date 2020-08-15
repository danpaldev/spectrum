

// @flow
/**
 * The combined schema out of types and resolvers (queries, mutations and subscriptions)
 */



//The graphql-tools library enables the creation and manipulation of GraphQL schema. 

//Apollo Server is able to accept a schema that has been enabled by graphql-tools.
//Apollo server directly exports all the function from graphql-tools,
//enabling a migration path for more complicated use cases.
const {
  makeExecutableSchema,
  addSchemaLevelResolveFunction,
} = require('graphql-tools');




const debug = require('debug')('api:resolvers');
const logExecutions = require('graphql-log')({
  logger: debug,
});
const { merge } = require('lodash');
import UserError from './utils/UserError';

const scalars = require('./types/scalars');
const generalTypes = require('./types/general');

const Thread = require('./types/Thread');
const Channel = require('./types/Channel');
const ChannelSlackSettings = require('./types/ChannelSlackSettings');
const Community = require('./types/Community');
const CommunitySlackSettings = require('./types/CommunitySlackSettings');
const Message = require('./types/Message');
const Reaction = require('./types/Reaction');
const User = require('./types/User');
const DirectMessageThread = require('./types/DirectMessageThread');
const Notification = require('./types/Notification');
const Meta = require('./types/Meta');
const Search = require('./types/Search');
const Invoice = require('./types/Invoice');
const CommunityMember = require('./types/CommunityMember');
const ThreadParticipant = require('./types/ThreadParticipant');

const ThreadQueries = require('./queries/thread');
const channelQueries = require('./queries/channel');
const communityQueries = require('./queries/community');
const messageQueries = require('./queries/message');
const userQueries = require('./queries/user');
const reactionQueries = require('./queries/reaction');
const directMessageThreadQueries = require('./queries/directMessageThread');
const notificationQueries = require('./queries/notification');
const metaQueries = require('./queries/meta');
const searchQueries = require('./queries/search');
const communityMemberQueries = require('./queries/communityMember');
const communitySlackSettingsQueries = require('./queries/communitySlackSettings');
const channelSlackSettingsQueries = require('./queries/channelSlackSettings');

const messageMutations = require('./mutations/message');
const threadMutations = require('./mutations/thread');
const reactionMutations = require('./mutations/reaction');
const communityMutations = require('./mutations/community');
const channelMutations = require('./mutations/channel');
const directMessageThreadMutations = require('./mutations/directMessageThread');
const notificationMutations = require('./mutations/notification');
const userMutations = require('./mutations/user');
const metaMutations = require('./mutations/meta');
const communityMemberMutations = require('./mutations/communityMember');
const fileMutations = require('./mutations/files');

const messageSubscriptions = require('./subscriptions/message');
const notificationSubscriptions = require('./subscriptions/notification');
const directMessageThreadSubscriptions = require('./subscriptions/directMessageThread');
const threadSubscriptions = require('./subscriptions/thread');
const communitySubscriptions = require('./subscriptions/community');

const rateLimit = require('./utils/rate-limit-directive').default;

const IS_PROD = process.env.NODE_ENV === 'production' && !process.env.FORCE_DEV;

const Root = /* GraphQL */ `
  directive @rateLimit(
    max: Int
    window: Int
    message: String
    identityArgs: [String]
    arrayLengthField: String
  ) on FIELD_DEFINITION

  # The dummy queries and mutations are necessary because
  # graphql-js cannot have empty root types and we only extend
  # these types later on
  # Ref: apollographql/graphql-tools#293
  type Query {
    dummy: String
  }

  type Mutation {
    dummy: String
  }

  type Subscription {
    dummy: String
  }

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`;

const resolvers = merge(
  {},
  //queries
  scalars.resolvers,
  ThreadQueries,
  channelQueries,
  communityQueries,
  messageQueries,
  userQueries,
  directMessageThreadQueries,
  reactionQueries,
  notificationQueries,
  metaQueries,
  searchQueries,
  communityMemberQueries,
  communitySlackSettingsQueries,
  channelSlackSettingsQueries,
  // mutations
  messageMutations,
  threadMutations,
  directMessageThreadMutations,
  reactionMutations,
  communityMutations,
  channelMutations,
  notificationMutations,
  userMutations,
  metaMutations,
  communityMemberMutations,
  fileMutations,
  // subscriptions
  messageSubscriptions,
  notificationSubscriptions,
  directMessageThreadSubscriptions,
  threadSubscriptions,
  communitySubscriptions
);

if (process.env.NODE_ENV === 'development' && debug.enabled) {
  logExecutions(resolvers);
}

// Create the final GraphQL schema out of the type definitions
// and the resolvers
const schema = makeExecutableSchema({
  typeDefs: [
    scalars.typeDefs,
    generalTypes,
    Root,
    Community,
    CommunitySlackSettings,
    CommunityMember,
    Channel,
    ChannelSlackSettings,
    Thread,
    ThreadParticipant,
    Message,
    Reaction,
    User,
    DirectMessageThread,
    Notification,
    Meta,
    Invoice,
    Search,
  ],
  resolvers,
  schemaDirectives: IS_PROD
    ? {
        rateLimit,
      }
    : {},
});



//addSchemaLevelResolveFunction adds a function to the schema that will be
//EXECUTED BEFORE OTHER RESOLVERS, but only ONCE PER REQUEST!

//It's useful for authentication, because you would be checking privileges each time that the client executes a query.

//In this example, we're just checking if our app is on maintenance mode. And if true, we will throw a error meassage!

if (process.env.REACT_APP_MAINTENANCE_MODE === 'enabled') {
  console.error('\n\n⚠️ ----MAINTENANCE MODE ENABLED----⚠️\n\n');
  addSchemaLevelResolveFunction(schema, () => {
    throw new UserError(
      "We're currently undergoing planned maintenance. We'll be back soon, please check https://twitter.com/withspectrum for ongoing updates!"
    );
  });
}

module.exports = schema;
