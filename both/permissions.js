// check that the userId specified owns the documents
ownsDocument = function(userId, doc) {
  return doc && doc.userId === userId;
};

getUsername = function(user) {
  if (user.profile.name) {
    return user.profile.name;
  } else {
    return user.emails[0].address.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/ +/g, ' ');
  }
};
