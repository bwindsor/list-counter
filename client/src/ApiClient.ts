export interface Item {
    name: string
    count: number
}

export default class ApiClient {
    apiBase: string

    constructor(apiBase: string) {
        this.apiBase = apiBase
    }

    getAllItems(): Promise<Item[]> {
        return fetch(this.apiBase + '/item').then(res => res.json())
    }

    incrementItem(id: string): Promise<void> {
        return this.getAllItems().then(item => {
            let itemToUpdate = item.filter(d => d.name === id)[0]
            return this.putItem({
                name: id,
                count: itemToUpdate.count + 1
            })
        }
        )
    }

    putItem(item: Item): Promise<void> {
        return fetch(this.apiBase + '/item', {
            body: JSON.stringify(item),
            method: "POST"
        }).then(res => {
            if (res.status !== 200) {
                throw new Error("Bad status code")
            }
        })
    }
}