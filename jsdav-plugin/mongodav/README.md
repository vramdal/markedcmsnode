Database structure
==================

The WebDAV tree is modeled as three MongoDB collections:

  - `content`
  - `pages`
  - `templates`

The `pages` collection
--------------------------
    
    {
        "_id": "123abc",
        "title": "Human-readable page title",
        "template": "frontpage",
        "content": {
            "mainstory": "index.md",
            "substory": "documentation.md",
            "substory2": "substory2.md"
        },
        "lastModified": date,
        "path": ","
    },
    {
        "_id": "456def",
        "title": "My first sub-page",
        "template": "article",
        "content": {
            "story": "some-story.md"
         },
         "lastModified": date,
         "path": ",my-first-subpage"
     }

    
The `template` property refers to a document in the `templates` collection. Properties of the `content` object
refers to documents in the `content` collection.

The `templates` collection
--------------------------

     {
       "name": "frontpage",
       "content": "Some Jade goes here",
       "lastModified": date
     }
     
The `content` collection
------------------------
     
     {
       "name":  "mystory.md",
       "content": "Some *Markdown*  goes here",
       "pageId": 123,
       "lastModified": date
     }
     