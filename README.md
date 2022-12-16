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

api.call('GET', "/hello").then((res) => {
    if (res.type === 'succeeded'){
        console.log(res.data.message)
    }
})

api.call("POST", "/echo", { body: { message: "hello world" }}).then((res) => {
    if (res.type === 'succeeded'){
        console.log(res.data.message)
    }
})
  

```

## 注意事項

### `content-type`はデフォルトで `text/plain` です

都度変更する場合は以下のようにheaderを指定してください

```ts
await api.call('POST', '/api/re', {headers: {'Content-type': 'application/json'}}, {text: 'hello world'})
```

全体で変更する場合は以下のようにApiClientの呼び出し方を変更してください

```ts
const api = apiClient<Schema>("https://develop.sankosc.co.jp/apitest/api", "application/json")
```

### set-cookieが設定されない

[MDN](https://developer.mozilla.org/ja/docs/Web/API/Fetch_API/Using_Fetch) からの引用になりますが、credentialsが`include`になっていないと設定されません。

> credentials オプションを include に設定しない限り、fetch() は次のように動作します。
>
>-    オリジン間リクエストではクッキーを送信しません。
>-    オリジン間のレスポンスでは、送り返されたクッキーを設定しません。
>-    2018 年 8 月現在、既定の資格情報ポリシーは same-origin に変更されています。 Firefox もバージョン 61.0b13 で変更されました）。

以下のように変更してください

```ts
await api.call('POST', '/api/auth/signin', {credentials: 'include', headers: {'content-type': 'application/json'}}, {username, password})
```

## 謝辞

このlibraryは [強力な型補完を行うRestAPI ClientをTypeScriptで実装した](https://blog.wh-plus.co.jp/entry/2020/12/21/104033) というWHITE PLUS TechBlog様の記事を参考に作成したライブラリです。
問題があった際はissue等にご連絡ください。
