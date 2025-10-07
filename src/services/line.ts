import { env } from "../utils/env";
export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export async function exchangeToken(code: string) {
  console.log("exchangeToken", code);
  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", env.redirectUri);
  params.append("client_id", env.channelId);
  params.append("client_secret", env.channelSecret);

  console.log("exchangeToken params", params);

  const res = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const json = await res.json();
  console.log("exchangeToken res", json);

  if (!res.ok) {
    throw new Error(`LINE token request failed: ${json.error}`);
  }

  return json; // { access_token, id_token, ... }
}

export async function verifyIdToken(idToken: string) {
  const params = new URLSearchParams();
  params.append("id_token", idToken);
  params.append("client_id", env.channelId);

  const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!res.ok) {
    throw new Error(`LINE verify failed: ${res.statusText}`);
  }

  return res.json(); // user profile
}

export const getLineProfile = async (
  accessToken: string
): Promise<LineProfile> => {
  // Endpoint ของ LINE สำหรับดึงข้อมูลโปรไฟล์
  const profileUrl = "https://api.line.me/v2/profile";

  try {
    const response = await fetch(profileUrl, {
      method: "GET",
      headers: {
        // ทุกครั้งที่คุยกับ LINE API ต้องมี Header นี้เสมอ
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // ถ้า Request ไม่สำเร็จ (เช่น token หมดอายุ) ให้โยน Error
    if (!response.ok) {
      const errorData = await response.json();
      console.error("LINE API Error:", errorData);
      throw new Error(errorData.message || "Failed to fetch LINE profile");
    }

    // ถ้าสำเร็จ ให้แปลงข้อมูล JSON แล้วส่งกลับ
    const profile: LineProfile = await response.json();
    return profile;
  } catch (error) {
    console.error("Error in getLineProfile:", error);
    // โยน Error ต่อเพื่อให้ Route ที่เรียกใช้จัดการ Error ต่อไป
    throw error;
  }
};
