export interface Ingredient {
    id: string
    text: string
    percent_estimate: number
    ingredients?: Ingredient[]
}

export interface Product {
    generic_name: string
    generic_name_fr: string
    image_front_url: string
    product_name_fr: string
    product_name: string
    ingredients: Array<Ingredient>
    nova_group: 1 | 2 | 3 | 4
    nutriscore_grade: string
    code: string
    nutrient_levels: {
        fat: string
        'saturated-fat': string
        sugars: string
        salt: string
    }
}
