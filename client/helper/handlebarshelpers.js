Handlebars.registerHelper("formatDate", function(timestamp) {
    return moment(new Date(timestamp)).fromNow();
});
