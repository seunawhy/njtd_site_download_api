var express = require('express');
var router = express.Router();
var Download = require('../models/Download.supabase');
const Axios = require('axios')

const Api = Axios.create({
  baseURL: process.env.OJS_API_URL
})
Api.interceptors.request.use((config) => {
  const hasQuery = config.url.includes('?')
  config.url += `${hasQuery ? '&' : '?'}apiToken=${process.env.OJS_API_KEY}`
  return config;
})

/* GET downloads listing. */
router.get('/', async (req, res, next) => {
  let publications = await Download.findAll(), processedPublications = []

  // If populate is set, populate 
  if (req.query.populate) {
    publications = Array.from(publications)
    for (let index = 0; index < publications.length; index += 1) {
      processedPublications.push(
        await Api.get(`/submissions/${publications[index].publication_id}`)
      )
    }
  } else processedPublications = publications
  res.json(processedPublications || publications || []);
});

/* GET downloads listing. */
router.get('/:id', async (req, res, next) => {
  res.json(await Download.findOne(req.params.id).then(
    async (publication) => req.query.populate ? await Axios.get(
      `/submissions/${pub.publication_id}`
    ).then((res) => res.json()) : publication
  ));
});

/* POST downloads listing. */
router.post('/', async (req, res, next) => {
  if (req.body.publication_id && req.body.count) {
    res.json(await Download.create({
      publication_id: req.body.publication_id,
      count: req.body.count
    }));
  } else {
    res.json({
      status: 400,
      msg: 'Invalid Request.'
    });
  }
});

/* PUT downloads listing. */
router.put('/:publication_id', async (req, res, next) => {
  res.json(await Download.update(req.params.publication_id))
});

module.exports = router;
