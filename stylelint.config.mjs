export default {
    plugins: ['stylelint-declaration-strict-value'],
    reportDescriptionlessDisables: true,
    // Os tokens são a origem dos valores crus; todo o resto lê deles.
    ignoreFiles: ['src/app/styles/tokens.css'],
    rules: {
        'scale-unlimited/declaration-strict-value': [
            [
                'font-size',
                '/^padding(?:-.+)?$/',
                '/^margin(?:-.+)?$/',
                'gap',
                'row-gap',
                'column-gap',
                'color',
                'background-color',
                'border-color',
            ],
            {
                ignoreFunctions: false,
                ignoreVariables: true,
                ignoreValues: [
                    '0',
                    'auto',
                    'inherit',
                    'transparent',
                    'currentColor',
                    '/^(?:calc|clamp|color-mix)\([\s\S]*\)$/',
                ],
            },
        ],
    },
}
