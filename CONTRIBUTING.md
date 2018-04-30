## Contributing to Magrit

#### Reporting issues

...

#### Repository structure

```
magrit
├── client                <--- JS/CSS source files
│   ├── css
│   ├── js
├── documentation
│   └── src               <--- Markdown files used for generating documentation
├── magrit_app            <--- Python source files
│   ├── helpers           <--- Python source files
│   ├── static            <--- Static assets + compiled JS/CSS code
│   └── templates         <--- HTML files
├── misc            
│   ├── Docker            <--- Example dockerfiles (using Nginx)
│   └── dockerfiles       <--- Dockerfile for automated build on DockerHub
└── tests                 <--- Test files (python)
```


#### Translating to a new language

...

#### Updating existing translation strings

...

#### Contributing documentation

The documentation is entirely written in *markdown* and translated to a webpage/book thanks to [**mdBook**](https://github.com/rust-lang-nursery/mdBook). It is located in the [documentation](https://github.com/riatelab/magrit/tree/master/documentation/) folder.  

After making a change on these `.md` files, you should run the mdbook binary from the aforesaid folder to build the new book:
```
mdbook build
```
The provided binary is only compatible with linux 64bits. If you're using another platform, please refer to [mdBook documentation](https://github.com/rust-lang-nursery/mdBook#installation) to install it.

The documentation is currently only available in French. Don't hesitate to contact us if you want to contribute an other language.

#### Contributing JS/html/CSS code (client side)

...

#### Building JS/CSS code

...

#### Contributing python code (server side)



#### Testing

...

#### Contributing to the deployement recipes

...

#### Licencing

Magrit is available under the [CeCILL License](www.cecill.info).
Some of the libraries it uses are under different licenses (see them in the [documentation](http://magrit.cnrs.fr/static/book/licenses_fr.html)).  
If you're contributing to Magrit, you're contributing CeCILL Licensed code.
