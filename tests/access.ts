import { apiClient } from "../src";


type Schema = {
    resource: {
        "/api/hello": {
            GET: {
                response: {"message": "hello"};
            };
        };

    };
  };
  

const api = apiClient<Schema>("https://develop.sankosc.co.jp/apitest")
api.call('GET', "/api/hello", {}).then((res) => {
    if (res.type === 'succeeded'){
        return (res.data.message)
    }
})