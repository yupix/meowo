# Meowo

このライブラリはTypeScriptでRestAPIを型安全に使う為のAPI Clientを提供します。

## 使い方

```ts
import {apiClient} from "strictcat"

type Schema = {
    resource: {
        "/hello": {
            GET: {
                response: {"message": "hello"};
            };
        };
        "/echo": {
            POST: {
                body: {
                    "message": string
                }
                response: {"message": string}
            }
        }
    };
  };
  
const api = apiClient<Schema>("https://develop.sankosc.co.jp/apitest/api")

api.call('GET', "/hello", {}).then((res) => {
    if (res.type === 'succeeded'){
        return (res.data.message)
    }
})

api.call("POST", "/echo", {}, {message: "hello world"}).then((res) => {
    if (res.type === 'succeeded'){
        return (res.data.message)
    }
})
  

```

## 謝辞

このlibraryは [強力な型補完を行うRestAPI ClientをTypeScriptで実装した](https://blog.wh-plus.co.jp/entry/2020/12/21/104033) というWHITE PLUS TechBlog様の記事を参考に作成したライブラリです。
問題があった際はissue等にご連絡ください。
