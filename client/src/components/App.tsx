import * as React from "react"
import ApiClient from "../ApiClient"
import { Item } from "../ApiClient"
import * as links from "../resources/links"
import Story from "./Story"
import PlusOne from "./PlusOne"
import NewStory from "./NewStory"
import { validateStoryName } from "../validation"

interface AppState {
    apiClient: ApiClient
    items: Item[]
}

export default class App extends React.Component<undefined, AppState> {
    isUnmounted: boolean = false
    rowClass = "row align-items-center border border-primary rounded m-1 p-1"

    constructor(props: any) {
        super(props)
        this.state = {
            apiClient: new ApiClient(links.API_BASE),
            items: []
        }
    }

    componentDidMount() {
        this.state.apiClient.getAllItems().then(items => {
            this.setItemsState(items)
        })
    }

    setItemsState(items: Item[]) {
        if (this.isUnmounted) { return }
        items = items.slice(0)
        items.sort(this.itemSorter)
        this.setState({ items: items })
    }

    itemSorter(a: Item, b: Item): number {
        return b.count - a.count
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
            this.setItemsState(updatedItems)
        })
    }

    plusOne(name: string) : Promise<void> {
        return this.state.apiClient.incrementItem(name).then(newCount => {
            let updatedItems = this.state.items.slice(0)
            let idxToUpdate = updatedItems.map(d => d.name).indexOf(name)
            updatedItems[idxToUpdate] = {
                name: name,
                count: newCount
            }
            this.setItemsState(updatedItems)
        })
    }

    render() {
        let names = this.state.items.map(d => d.name)

        return <div className="container-fluid">
                <NewStory
                    rowClass={this.rowClass}
                    onAdd={s => this.addStory(s)}
                    nameValidator={s => validateStoryName(s, names)}
                />
            {this.state.items.map((item, i) => this.renderStoryRow(item, i))}
        </div>
    }

    renderStoryRow(item: Item, i: number) {
        return <div key={`story-${i}`} className={this.rowClass}>
            <div className="col mr-auto">
                <Story name={item.name} count={item.count} />
            </div>
            <div className="col-auto px-0">
                <PlusOne onPlusOne={() => this.plusOne(item.name)} />
            </div>
        </div>
    }
}