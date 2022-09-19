import {apiClient} from "../built/index"
import {ISchema} from "../built/types"


const api = apiClient<typeof Schema>("https://develop.sankosc.co.jp/apitest/api")
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