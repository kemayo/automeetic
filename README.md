# Automeetic

An event-subscription webapp, using the WordPress REST API as a backend.

## Goals

• As a visitor I should be able to see a calendar with all the events somebody of the group is participating in.
• As a visitor I should be able to see a map of all of the events.
• As a visitor I should be able to see a list of all of the events.
• As a visitor I should be able to see details for an event – description, dates, location, participants and their roles.
• As a logged in visitor I should be able to see all listings, but they should include private events, too.
• As a logged in user I should be able to add myself to an already existing event, stating my role.
• As a logged in user I should be able to add a new event with a description, dates, location, and whether it’s public or private.

## Installation

Run:

```
npm install
```

This gets the dependencies you'll need. You can then run `node index.js` to throw up a quick static server to view the app with.

You need to copy `config.sample.js` to `config.js` and add your app's client_id and your host.

Generate a client id here: https://developer.wordpress.com/apps/
