tweet and/or toot.

![noot and/or twoot](https://i.imgur.com/uRv31NC.gif)

### install

```
npm install twoot
```


### twoot

```js
import { tweet, toot, twoot } from 'twoot'

// tweet!
tweet({
  consumerKey,
  consumerSecret,
  accessKey,
  accessSecret,
  status: 'hello from twoot',
  attachments: ['/path/to/an/image/or/video.webm']
})

// toot!
toot({
  token,
  server, // optional, defaults to https://mastodon.social
  status: 'toot toot'
  attachments: ['/path/to/an/image/or/video.webm']
})

// twoot!
twoot(
  [
    {
      consumerKey: string
      consumerSecret: string
      accessKey: string
      accessSecret: string
    },
    {
      token: string
      server: string
    },
    {
      token: string
      server: string
    },
    ...
  ],
  'posting statuses to multiple accounts at once!',
  [
    '/with/attachments/too',
    '/home/desktop/a_very_good_cat.jpg'
  ]
)
```

all three methods return promises:
- `toot` returns a mastodon [Status](https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#status) object
- `tweet` returns a twitter [Tweet](https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/tweet-object) object
- `twoot` just returns an array of urls of the posted statuses, since that's probably what you care about if anything.

```js
twoot({ ... }, 'twoot!').then(urls => { console.log(`twoots can be found at: ${urls.join(', ')}`) })
```
