# login.dfe.examples.saml-client
Example SAML client to connect to DfE Login SAML Proxy

## Getting Started

Install deps
```
npm i
```

Setup Keystore & devlopment ssl certs
```
npm run setup
```

Run
```
npm run dev
```

Visit
```
https://localhost:44301/
```

## Params
By default it will connect to the local running instance of login.dfe.saml-proxy. If you would like to connect to a different SAML identity provider then set the environment variables:

* IDENTITY_URL - Full url to the identity provider sign-on endpoint
* IDENTITY_ISSUER - The issuer id provided for your service provider