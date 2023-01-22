const express = require('express');
const postRouter = express.Router();
const { getAllPosts, createPost, getPostById, updatePost } = require('../db');
const { requireUser } = require('./utils');



postsRouter.use((req, res, next) => {
    console.log('A request is being made to /posts');

    next();
});

postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
    const { postId } = req.params;
    const { title, content, tags } = req.body;

    const updateFields = {};

    if (tags && tags.length > 0) {
        updateFields.tags = tags.trim().split(/\s+/);
    }

    if (title) {
        updateFields.title = title;
    }

    if (content) {
        updateFields.content = content;
    }

    try {
        const originalPost = await getPostById(postId);

        if (originalPost.author.id === req.user.id) {
            const updatedPost = await updatePost(postId, updateFields);
            res.send({ post: updatedPost })
        } else {
            next({
                name: 'UnauthorizedUserError',
                message: 'YOU CANNOT UODATE THIS POST, AS IT IS NOT YOURS'
            })
        }
    } catch ({ name, message }) {
        next({ name, message });
    }
});

postsRouter.post('/', requireUser, async (req, res, next) => {
    try {
        const { title, content, tags = "" } = req.body;

        const tagArr = tags.trim().split(/\s+/);
        const postData = { authorId: req.user.id, title, content };

        if (tagArr.length) {
            postData.tags = tagArr;
        }

        const post = await createPost(postData);

        if (post) {
            res.send({ post })
        } else {
            next({
                name: 'PostError',
                message: `Oh no!`
            });
        }
    } catch ({ name, message }) {
        next({ name, message });
    }
});

postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
    try {
        const post = await getPostById(req.params.postId);

        if (post && post.author.id === req.user.id) {
            const updatedPost = await updatePost(post.id, { active: false });

            res.send({ post: updatedPost });
        } else {
            next(post ? {
                name: "UnauthorizedUserError",
                message: "YOU CANNOT DELELTE THIS POST AS IT IS NOT YOURS"
            } : {
                name: "PostNotFoundError",
                message: "POST DOESN'T EXIST"
            });
        }
    } catch ({ name, message }) {
        next({ name, message })
    }
});

postsRouter.get('/', async (req, res) => {
    try {
        const allPosts = await getAllPosts();
        const posts = allPosts.filter(post => {
            return post.active || (req.user && post.author.id === req.user.id);
        });
        res.send({
            posts
        });
    } catch ({ name, message }) {
        next({ name, message });
    }
});

postsRouter.get('/', async (req, res) => {
    const posts = await getAllPosts();

    res.send({
        posts
    });
});

module.exports = postRouter;