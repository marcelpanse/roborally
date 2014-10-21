Template.usersPill.helpers({
	usersOnline: function() {
		return Meteor.users.find();
	}
});