var express = require('express');
var router = express.Router();
var Download = require('../models/Download');
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
  let publications = await Download(process.sequelize).findAll({
    attributes: ['publicationId', 'count'],
    limit: parseInt(req.query.limit || 5) || 5,
    order: [
      ['count', 'DESC']
    ]
  }), processedPublications = []

  // If populate is set, populate 
  if (req.query.populate) {
    publications = Array.from(publications)
    for (let index = 0; index < publications.length; index += 1) {
      processedPublications.push(
        await Api.get(`/submissions/${publications[index].publicationId}`)
      )
    }
  }
  res.json(processedPublications || publications);
});

/* GET downloads listing. */
router.get('/:id', async (req, res, next) => {
  res.json(await Download(process.sequelize).findOrCreate({
    where: {
      publicationId: req.params.id
    },
    defaults: {
      count: 0
    }
  }).then(async (pub) => req.query.populate ? await Axios.get(
    `/submissions/${pub.publicationId}`
  ).then((res) => res.json()) : pub));
});

/* POST downloads listing. */
router.post('/', async (req, res, next) => {
  if (req.body.publicationId && req.body.count) {
    res.json(await Download(process.sequelize).create({
      publicationId: req.body.publicationId,
      count: req.body.count
    }));
  } else {
    res.json(await Download(process.sequelize).create({
      status: 400,
      msg: 'Invalid Request.'
    }));
  }
});

/* PUT downloads listing. */
router.put('/:publicationId', async (req, res, next) => {
  const count = await Download(process.sequelize).findOne({
    attributes: ['count'],
    where: {
      publicationId: req.params.publicationId
    }
  })
  if (count) {
    await Download(process.sequelize).update({
      count: count.getDataValue('count') + 1
    }, {
      where: {
        publicationId: req.params.publicationId
      }
    })
    res.json({
      count: count.getDataValue('count') + 1,
      publicationId: req.params.publicationId
    })
  } else {
    res.json({
      status: 404,
      msg: 'NOT_FOUND'
    });
  }
});

module.exports = router;
