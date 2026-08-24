const Rules = (() => {

    function translateProduct(name) {

        return PRODUCT_MAP[name] || name;

    }


    function buildQuantity(product) {

        const name = String(product.name || "").trim();

        const quantity = product.quantity;


       if (
    name ===
    "كورس زيادة الوزن وفتح الشهية - 3 حبات +1 هدية"
    ||
    name ===
    "عسل فاتح للشهية وزيادة الوزن - كورس زيادة الوزن وفتح الشهية - 3 حبات +1 هدية"
    ||
    name ===
    "عسل فاتح للشهية وزيادة الوزن - كورس زيادة الوزن وفتح الشهية - 3 حبات +1 هدية"
) {

    if (Number(quantity) === 1) {
        return "1(4)";
    }

}
        if (
             name ===
             "خلطة ود لاند اكس 2 + 1 مجاني"
        ) {
             if (Number(quantity) === 1) {
            return "1(3)";
            }
        }


        return quantity;

    }


    function buildProducts(products) {

        return {

            order: products
                .map(product =>
                    translateProduct(product.name)
                )
                .join("\n"),


            quantity: products
                .map(product =>
                    buildQuantity(product)
                )
                .join("\n")

        };

    }


    function buildRow(order) {

        const products =
            buildProducts(order.products);


        return [

            "",

            order.name,

            order.phone,

            order.address,

            products.order,

            products.quantity,

            order.total,

            ""

        ];

    }


    return {

        translateProduct,

        buildProducts,

        buildRow

    };

})();