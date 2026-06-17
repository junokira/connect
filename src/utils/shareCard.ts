import { User } from "../types";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | undefined>((resolve) => {
    if (!src) {
      resolve(undefined);
      return;
    }
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(undefined);
    image.src = src;
  });

const roundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
};

const avatarFallback = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#94a3b8";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size * 0.42, size * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + size / 2, y + size * 0.78, size * 0.3, size * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
};

export async function createProfileShareCard(user: User, url: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");

  const banner = await loadImage(user.bannerUrl);
  const avatar = await loadImage(user.avatarUrl);

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, "#050505");
  gradient.addColorStop(0.45, "#07111f");
  gradient.addColorStop(1, "#0f172a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.globalAlpha = 0.32;
  ctx.fillStyle = "#0a84ff";
  ctx.beginPath();
  ctx.arc(180, 260, 420, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2dd4bf";
  ctx.beginPath();
  ctx.arc(920, 1220, 360, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  roundedRect(ctx, 80, 270, 920, 1220, 64);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = 2;
  ctx.stroke();

  roundedRect(ctx, 110, 300, 860, 430, 48);
  ctx.save();
  ctx.clip();
  if (banner) {
    const scale = Math.max(860 / banner.width, 430 / banner.height);
    const width = banner.width * scale;
    const height = banner.height * scale;
    ctx.drawImage(banner, 110 + (860 - width) / 2, 300 + (430 - height) / 2, width, height);
  } else {
    const bannerGradient = ctx.createLinearGradient(110, 300, 970, 730);
    bannerGradient.addColorStop(0, "#0a84ff");
    bannerGradient.addColorStop(1, "#14b8a6");
    ctx.fillStyle = bannerGradient;
    ctx.fillRect(110, 300, 860, 430);
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(540, 770, 140, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) {
    ctx.drawImage(avatar, 400, 630, 280, 280);
  } else {
    avatarFallback(ctx, 400, 630, 280);
  }
  ctx.restore();
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(540, 770, 145, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 72px 'DM Sans', ui-sans-serif, system-ui";
  ctx.fillText(user.displayName || user.username, 540, 1010, 820);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 42px 'DM Sans', ui-sans-serif, system-ui";
  ctx.fillText(`@${user.username}`, 540, 1074, 820);

  if (user.verified) {
    ctx.fillStyle = "#0a84ff";
    ctx.beginPath();
    ctx.arc(760, 990, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(748, 990);
    ctx.lineTo(758, 1000);
    ctx.lineTo(775, 978);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "500 34px 'DM Sans', ui-sans-serif, system-ui";
  const bio = (user.bio || "Explore my VZN profile.").replace(/\s+/g, " ").trim();
  const words = bio.split(" ");
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const next = `${line} ${word}`.trim();
    if (ctx.measureText(next).width > 760 && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((value, index) => ctx.fillText(value, 540, 1170 + index * 48, 760));

  roundedRect(ctx, 250, 1350, 580, 88, 44);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 34px 'DM Sans', ui-sans-serif, system-ui";
  ctx.fillText("vzn.awakencult.com", 540, 1406);

  ctx.fillStyle = "#64748b";
  ctx.font = "600 28px 'DM Sans', ui-sans-serif, system-ui";
  ctx.fillText(url.replace(/^https?:\/\//, ""), 540, 1550, 840);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create share card."));
    }, "image/png", 0.92);
  });
}

export async function shareProfileCard(user: User, url: string) {
  const blob = await createProfileShareCard(user, url);
  const file = new File([blob], `vzn-${user.username}.png`, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: `${user.displayName} on VZN`, text: `VZN profile: @${user.username}`, url, files: [file] });
    return;
  }
  if (navigator.share) {
    await navigator.share({ title: `${user.displayName} on VZN`, text: `VZN profile: @${user.username}`, url });
    return;
  }
  await navigator.clipboard.writeText(url);
}
