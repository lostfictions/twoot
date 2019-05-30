### Deprecation notice

With Twitter's hobbyist- and developer-hostile API access policy changes, I'm no
longer making new bots or apps against the Twitter API. (Unless someone wants to
pay me to do it!)

This package is therefore going into maintenance mode and won't be receiving new
features. Fortunately, there's some great packages you can use to take its place:

- For the Twitter API, I'd recommend using
  [twit](https://github.com/ttezel/twit), which twoot wraps (though it
  unfortunately hasn't seen any development work in a year at the time of this
  writing.) [Typings are available](https://www.npmjs.com/package/@types/twit)
  for TypeScript users.
- For Mastodon, [masto.js](https://github.com/neet/masto.js) currently seems
  like the best pick out there. It's nicely documented, supports streaming APIs,
  is written in TypeScript, and keeps up with Masto API changes.

---

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
