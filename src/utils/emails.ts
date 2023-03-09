import { Env } from "../types";

interface EmailTypes {
  "verify-email": {
    name: string;
    verificationToken: string;
  };
  "email-verified": {
    name: string;
  },
  "request-password-reset": {
    name: string;
    resetId: string;
    resetToken: string;
  },
  "password-recovered": {
    name: string;
  }
}

type EmailInfo<T extends keyof EmailTypes> = {
  to: string; // email address
  type: T;
  data: EmailTypes[T];
}

type Templates = {
  [key in keyof EmailTypes]: {
    id: string,
    dataMapper: (data: EmailTypes[key]) => object
  }
};

const templates: Templates = {
  "verify-email": {
    id: "d-722ec90f3d424169bb7d9da3d20c1b24",
    dataMapper: (data) => ({
      name: data.name,
      confirmLink: "https://dicyvpn.com/register/verify?token=" + encodeURIComponent(data.verificationToken)
    })
  },
  "email-verified": {
    id: "d-21512354a12640cf9294e1f7e439c933",
    dataMapper: (data) => data
  },
  "request-password-reset": {
    id: "d-eaffeaab653f443db6a9164ade3d91c5",
    dataMapper: (data) => ({
      name: data.name,
      resetLink: "https://dicyvpn.com/reset-password?resetId=" + encodeURIComponent(data.resetId) + "&resetToken=" + encodeURIComponent(data.resetToken)
    })
  },
  "password-recovered": {
    id: "d-27bf3842485c4886bef8f1a5e0ae693b",
    dataMapper: (data) => data
  }
};

export default async function sendEmail<T extends keyof EmailTypes>(info: EmailInfo<T>, env: Env): Promise<void> {
  const template = templates[info.type];
  const dynamicData = template.dataMapper(info.data);
  const body = {
    personalizations: [{
      to: [{ email: info.to }],
      dynamic_template_data: dynamicData
    }],
    from: {
      email: env.SENDGRID_FROM_EMAIL,
      name: "DicyVPN"
    },
    template_id: template.id
  };

  const response = await fetch(env.SENDGRID_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.SENDGRID_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error("Failed to send email: " + response.statusText);
  }
};
