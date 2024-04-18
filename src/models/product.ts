export interface Ingredient {
    id: string
    text: string
    percent_estimate: number
}

export interface Product {
    generic_name: string
    generic_name_fr: string
    image_front_url: string
    product_name_fr: string
    product_name: string
    ingredients: Array<Ingredient>
    nova_group: 1 | 2 | 3 | 4
}