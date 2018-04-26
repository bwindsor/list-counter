import * as React from "react"
import ApiClient from "../ApiClient"
import {Item} from "../ApiClient"
import * as links from "../resources/links"
import Story from "./Story"
import NewStory from "./NewStory"

interface AppState {
    apiClient: ApiClient
    items: Item[]
}

export default class App extends React.Component<undefined, AppState> {
    isUnmounted: boolean = false

    constructor(props: any) {
        super(props)
        this.state = {
            apiClient: new ApiClient(links.API_BASE),
            items: []
        }
    }

    componentDidMount() {
        this.state.apiClient.getAllItems().then(items => {
            if (this.isUnmounted) { return }
            items.sort(this.itemSorter)
            this.setState({items: items})
        })
    }

    itemSorter(a: Item,b: Item): number {
        return a.count - b.count
    }

    componentWillUnmount() {
        this.isUnmounted = true
    }

    addStory(name: string) {
        let newItem: Item = {
            name: name,
            count: 0
        }
        this.state.apiClient.putItem(newItem).then(() => {
            let updatedItems = this.state.items.slice(0)
            updatedItems.push(newItem)
            updatedItems.sort(this.itemSorter)
            if (this.isUnmounted) { return }
            this.setState({items: updatedItems})
        })
    }

    render() {
        return <div>
            <NewStory onAdd={s => this.addStory(s)}/>
            {this.state.items.map((item, i) => <Story key={`story-${i}`} name={item.name} count={item.count} />)}
        </div>
    }
}