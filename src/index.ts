import { toot } from './toot'
import { tweet } from './tweet'

export { toot } from './toot'
export { tweet } from './tweet'

export interface TootConfig {
  token: string
  server?: string
}

export interface TweetConfig {
  consumerKey: string
  consumerSecret: string
  accessKey: string
  accessSecret: string
}

export type Configs = (TootConfig | TweetConfig)[]

export function twoot(configs: Configs, status: string, attachments: string[]): Promise<string[]> {
  return Promise.all(configs.map(async config => {
    if((config as TweetConfig).consumerKey) {
      const tweetResponse = await tweet({
        ...config as TweetConfig,
        status,
        attachments
      })

      return `https://twitter.com/${tweetResponse.user.screen_name}/status/${tweetResponse.id_str}`
    }
    const tootResponse = await toot({
      ...config as TootConfig,
      status,
      attachments
    })

    return tootResponse.url
  }))
}
