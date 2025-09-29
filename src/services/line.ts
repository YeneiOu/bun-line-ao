import { env } from "../utils/env"

export async function exchangeToken(code: string) {
  console.log("exchangeToken", code)
  const params = new URLSearchParams()
  params.append("grant_type", "authorization_code")
  params.append("code", code)
  params.append("redirect_uri", env.redirectUri)
  params.append("client_id", env.channelId)
  params.append("client_secret", env.channelSecret)

  console.log("exchangeToken params", params)

  
  const res = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  })

  console.log("exchangeToken res", res)

  if (!res.ok) {
    throw new Error(`LINE token request failed: ${res.statusText}`)
  }

  return res.json() // { access_token, id_token, ... }
}

export async function verifyIdToken(idToken: string) {
  const params = new URLSearchParams()
  params.append("id_token", idToken)
  params.append("client_id", env.channelId)

  const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  })

  if (!res.ok) {
    throw new Error(`LINE verify failed: ${res.statusText}`)
  }

  return res.json() // user profile
}
