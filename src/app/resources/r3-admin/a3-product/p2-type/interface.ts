export interface List {

    data: Data[]
}

export interface Data {
    id              : number,
    name            : string,
    image           : string,
    created_at      : Date
    n_of_products   : number,
}
