// check that the userId specified owns the documents
ownsDocument = function(userId, doc) {
  return doc && doc.userId === userId;
};

getUsername = function(user) {
  return (user.profile.name) ? user.profile.name : user.emails[0].address;
};
