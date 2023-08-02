## 2.2.2 (2023-08-02)

### Fix

- **npm**: fix problems flagged by npm audit

## 2.2.1 (2023-08-02)

### Fix

- **atom-feed**: do not attempt to create feed if there are no dated articles

## 2.2.0 (2023-08-01)

### Feat

- **atom-feed**: adds atom feed generation
- **example**: add updated metadata to example article
- **example-website**: update image link in example articles

### Fix

- **atom-feed**: rewrite relative URLs to absolute

## 2.1.0 (2023-03-08)

### Feat

- **markdown**: adds use_md method allowing for custom markdown-it plugins

## 2.0.0 (2023-03-07)

### BREAKING CHANGE

- pages that rely on anchor tags with non-alphanumerical characters will break

### Feat

- **anchor-tags**: remove non-alphanumerical characters from anchor tags

## 1.1.0 (2021-08-08)

### Feat

- don't display date on un-dated articles in tagged posts pages
- include un-dated articles on tagged posts pages
- replace hyphens in tag names with non-breaking hyphens on the tags page
- handle yaml parsing errors
- handle image crunching errors
- handle sass compilation errors
- handle pug compilation errors
- verify config
- adds default configuration

### Fix

- fixes page shifting when scrollbar is present
- fixes sass filename not appearing in error messages
- upgrade example project to 1.0.1

## 1.0.1 (2021-05-14)

### Feat

- update to 1.0.0
- handle promises properly
- open external links in new tab
- adds markdown-it-external-links
- use created date as updated date if updated isn't defined
- enable collapsible and anchor plugins
- adds markdown-it plugins
- adds tagged post pages
- generate posts page
- adds dateformat
- filter unpublished articles from tags
- extract tags and generate tags page
- generate page metadata
- adds jsdom
- crunch images
- adds sharp
- parse inline article metadata
- adds yaml
- adds markdown to article compilation with pug templates
- adds pug
- adds markdown-it
- adds sass to css compilation
- adds node-sass
- adds .gitignore

### Fix

- fixes metadate not being used in tags and posts
- removes trash scratch objects from index.html

### Refactor

- removes unnecessary path calculation
