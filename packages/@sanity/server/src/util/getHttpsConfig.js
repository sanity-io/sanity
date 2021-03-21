import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import selfsigned from 'selfsigned'

function createCertificate(attributes) {
  return selfsigned.generate(attributes, {
    algorithm: 'sha256',
    days: 30,
    keySize: 2048,
    extensions: [
      // {
      //   name: 'basicConstraints',
      //   cA: true,
      // },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true,
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        timeStamping: true,
      },
      {
        name: 'subjectAltName',
        altNames: [
          {
            // type 2 is DNS
            type: 2,
            value: 'localhost',
          },
          {
            type: 2,
            value: 'localhost.localdomain',
          },
          {
            type: 2,
            value: 'lvh.me',
          },
          {
            type: 2,
            value: '*.lvh.me',
          },
          {
            type: 2,
            value: '[::1]',
          },
          {
            // type 7 is IP
            type: 7,
            ip: '127.0.0.1',
          },
          {
            type: 7,
            ip: 'fe80::1',
          },
        ],
      },
    ],
  })
}

function getCertificate() {
  // Use a self-signed certificate if no certificate was configured.
  // Cycle certs every 24 hours
  const certificateDir = os.tmpdir()
  const certificatePath = path.join(certificateDir, 'server.pem')

  let certificateExists = fs.existsSync(certificatePath)

  if (certificateExists) {
    const certificateTtl = 1000 * 60 * 60 * 24
    const certificateStat = fs.statSync(certificatePath)

    const now = new Date()

    // cert is more than 30 days old, kill it with fire
    if ((now - certificateStat.ctime) / certificateTtl > 30) {
      fs.unlinkSync(certificatePath)

      certificateExists = false
    }
  }

  if (!certificateExists) {
    const attributes = [{name: 'commonName', value: 'localhost'}]
    const pems = createCertificate(attributes)

    fs.mkdirSync(certificateDir, {recursive: true})
    fs.writeFileSync(certificatePath, pems.private + pems.cert, {
      encoding: 'utf8',
    })
  }

  return fs.readFileSync(certificatePath)
}

// Ensure the certificate and key provided are valid and if not
// throw an easy to debug error
function validateKeyAndCerts({cert, key, keyFile, crtFile}) {
  let encrypted
  try {
    // publicEncrypt will throw an error with an invalid cert
    encrypted = crypto.publicEncrypt(cert, Buffer.from('test'))
  } catch (err) {
    throw new Error(`The certificate "${crtFile}" is invalid.\n${err.message}`)
  }

  try {
    // privateDecrypt will throw an error with an invalid key
    crypto.privateDecrypt(key, encrypted)
  } catch (err) {
    throw new Error(`The certificate key "${keyFile}" is invalid.\n${err.message}`)
  }
}

// Read file and throw an error if it doesn't exist
function readEnvFile(file, type) {
  if (!fs.existsSync(file)) {
    throw new Error(`You specified ${type} in your env, but the file "${file}" can't be found.`)
  }
  return fs.readFileSync(file)
}

function getHttpsConfig(httpsFlag) {
  const {SSL_CRT_FILE, SSL_KEY_FILE} = process.env

  if (SSL_CRT_FILE && SSL_KEY_FILE) {
    const config = {
      cert: readEnvFile(SSL_CRT_FILE, 'SSL_CRT_FILE'),
      key: readEnvFile(SSL_KEY_FILE, 'SSL_KEY_FILE'),
    }
    validateKeyAndCerts({...config, keyFile: SSL_CRT_FILE, crtFile: SSL_KEY_FILE})
    return config
  }
  const fakeCert = getCertificate()
  return {
    cert: fakeCert,
    key: fakeCert,
  }
}

export default getHttpsConfig
