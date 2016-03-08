import Joi from 'joi'

const schema = Joi.object({
  plugins: Joi.array().items(Joi.string().lowercase()).unique(),
  fulfills: Joi.array().items(Joi.object().keys({
    role: Joi.string().required(),
    path: Joi.string().required(),
    srcPath: Joi.string()
  })),
  provides: Joi.array().items(Joi.object().keys({
    role: Joi.string().required(),
    path: Joi.string(),
    srcPath: Joi.string(),
    multiple: Joi.boolean(),
  }))
}).unknown(true)

export default function validateManifest(manifest) {
  const {error} = Joi.validate(manifest, schema, {convert: false})
  return error ? Promise.reject(error) : Promise.resolve(manifest)
}
