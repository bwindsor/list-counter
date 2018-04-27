export interface Item {
    name: string
    count: number
}
export interface Count {
    count: number
}
export interface Name {
    name: string
}

export default class ApiClient {
    apiBase: string

    constructor(apiBase: string) {
        this.apiBase = apiBase
    }

    getAllItems(): Promise<Item[]> {
        return fetch(this.apiBase + '/item').then(res => res.json())
    }

    incrementItem(id: string): Promise<number> {
        return fetch(this.apiBase + '/item/increment', {
            body: JSON.stringify({name: id}),
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST"
        }).then(res => {
            if (res.status !== 200) {
                throw new Error("Bad status code")
            }
            return res.json()
        }).then((json: Count) => json.count)
    }

    putItem(item: Item): Promise<void> {
        return fetch(this.apiBase + '/item', {
            body: JSON.stringify(item),
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST"
        }).then(res => {
            if (res.status !== 200) {
                throw new Error("Bad status code")
            }
        })
    }
}