# Relationships App

## Overview

This web app is meant to help me track and maintain relationships with people I don't often interact with (such as long-distance relationships), but with whom I still want to keep in touch with long term.

It’s currently in very early stages, with much to be added and improved upon.

## Demo Video
`<Demo video will be embedded here when ready>`

## Tech Stack
I chose the MEAN stack because I wanted to learn these technologies.  That’s how I usually choose a tech stack for personal projects.
Frontend:
- Angular (w/TypeScript, Sass, RxJs, and Angular Material)
- Luxon (date/time library)
Backend:
- Node.js
- Express
- MongoDB

## Room for Growth
This project has so far been built in a very fluid manner.  Production-level concerns were sometimes sidelined while I explored ideas and just had fun with it.

Here are some such concerns that need to be addresssed:
- Authentication is absent.
- No test code has been written.
- API requests and responses are far from efficient.


## Additional Technical Details
**Standalone Components Architecture**
- No NgModules - uses Angular's modern standalone components API
- Direct imports for better tree-shaking and smaller bundle sizes
  
**Signal-Based Reactive State**
- Angular signals for reactive state management
- Improved performance with fine-grained reactivity

**Responsive Design**
- A mobile-first approach that aims for ease of use no matter what device is used.

## Possible Future Features
- Notification system for alerts when attention is needed for a relationship.
- Charts/graphs to visualize interaction patterns and statistics.
- Additional view options for Relationships/Interactions pages (e.g. data table view).
- Additional filters for Relationships/Interactions pages (e.g. date range, topic, etc.)
- Multi-user support in case I want to share this app with friends/family.
- Pagination or virtual scrolling of data.
- Autocomplete for previously used topics.
- Add special “follow up on” notes to remind yourself of what’s needed in future interactions.
- Pause/disable/snooze notifications on a particular relationship.
- Multi-select for bulk deletions/etc. of relationships/interactions/topics.
- Upload a photo of the people you want to stay in touch with.
- Support for multiple UI themes.
- Custom interaction types beyond the predefined set.
- Calender integration with reminder system.
- Data export/import support.
