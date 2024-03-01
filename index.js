const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
var session = require('express-session');

const multer = require('./multer.js');

const Posts = require('./Posts.js');
const upload = require('./multer.js');

mongoose.set('strictQuery', false);
mongoose.connect('mongodb+srv://noticias:uwtF83jupc6cPwEK@cluster0.bw5xlql.mongodb.net/matheusNews?retryWrites=true&w=majority').then(() => {
    console.log('conectado com sucesso!')
}).catch((err) => {
    console.log(err.message)
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 600000 } }))

// app.use(fileUpload({
//     useTempFiles: true,
//     tempFileDir: path.join(__dirname, 'temp')
// }));


app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'pages'))


app.get('/busca', (req, res) => {
    res.render('busca');
})

app.get('/', (req, res) => {

    if (req.query.buscar == null) {
        Posts.find({}).sort({ '_id': -1 }).exec((err, posts) => {
            // console.log(posts[0])
            posts = posts.map((val) => {
                return {
                    titulo: val.titulo,
                    imagem: val.imagem,
                    categoria: val.categoria,
                    autor: val.autor,
                    conteudo: val.conteudo,
                    descricaoCurta: val.conteudo.substr(0, 100),
                    slug: val.slug
                }
            });

            Posts.find({}).sort({ 'views': -1 }).limit(3).exec((err, postsTop) => {
                postsTop = postsTop.map((val) => {
                    return {
                        titulo: val.titulo,
                        imagem: val.imagem,
                        categoria: val.categoria,
                        autor: val.autor,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0, 100),
                        slug: val.slug
                    }
                });
                res.render('home', { posts: posts, postsTop: postsTop })
            })


        });

    } else {
        Posts.find({ titulo: { $regex: req.query.buscar, $options: "i" } }, function (err, posts) {
            console.log(posts)
            res.render('busca', { posts: posts, contagem: posts.length })
        })
    }
})

app.get('/:slug', (req, res) => {
    // res.send(req.params.slug)
    Posts.findOneAndUpdate({ slug: req.params.slug }, { $inc: { views: 1 } }, { new: true }, (err, resposta) => {
        // console.log(resposta)

        if (resposta != null) {
            Posts.find({}).sort({ 'views': -1 }).limit(3).exec((err, postsTop) => {
                postsTop = postsTop.map((val) => {
                    return {
                        titulo: val.titulo,
                        imagem: val.imagem,
                        categoria: val.categoria,
                        conteudo: val.conteudo,
                        autor: val.autor,
                        descricaoCurta: val.conteudo.substr(0, 100),
                        slug: val.slug
                    }

                });
                res.render('single', { noticia: resposta, postsTop: postsTop })
            })

        } else {
            res.render('error404', {})
        }
    })
})

var usuarios = [{
    login: 'matheus',
    senha: '12345'
}]

app.get('/admin/login', (req, res) => {

    if (req.session.login == null) {
        res.render('admin-login', {})
    } else {
        if (req.query.busca == null) {
            Posts.find({}).sort({ '_id': -1 }).exec((err, posts) => {
                posts = posts.map((val) => {
                    return {
                        id: val._id,
                        titulo: val.titulo,
                        imagem: val.imagem,
                        categoria: val.categoria,
                        autor: val.autor,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0, 100),
                        slug: val.slug,
                        views: val.views
                    }
                });
                res.render('admin-panel', { posts: posts },)
            });
        }
    }
})

app.get('/admin/delete/:id', (req, res) => {
    Posts.deleteOne({ _id: req.params.id }).then(() => {
        res.redirect('/admin/login')
    })
})

app.post('/admin/login', (req, res) => {
    usuarios.map((val) => {
        if (val.login == req.body.login && val.senha == req.body.senha) {
            req.session.login = 'matheus'
        }
    })
    res.redirect('/admin/login');
})
app.post('/admin/cadastro', upload.single('file'), (req, res) => {



    console.log(req.file)
    Posts.create({
        titulo: req.body.admin_titulo,
        imagem: '/public/images/' + req.file.filename,
        categoria: req.body.admin_categoria,
        conteudo: req.body.admin_conteudo,
        slug: req.body.admin_slug,
        autor: req.body.admin_autor,
        views: 0
    });

    res.redirect('/admin/login')
})


app.listen(5000, () => {
    console.log('Server Running on port 5000')
})