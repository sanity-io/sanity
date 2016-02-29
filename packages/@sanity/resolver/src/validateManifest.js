import Joi from 'joi'

const schema = Joi.object({
  plugins: Joi.array().items(Joi.string().lowercase()).unique(),
  fulfills: Joi.array().items(Joi.object().keys({
    role: Joi.string().required(),
    path: Joi.string().required()
  })),
  provides: Joi.array().items(Joi.object().keys({
    role: Joi.string().required(),
    multiple: Joi.boolean(),
    path: Joi.string()
  }))
}).unknown(true)

export default function validateManifest(manifest) {
  const {error} = Joi.validate(manifest, schema, {convert: false})
  return error ? Promise.reject(error) : Promise.resolve(manifest)
}
