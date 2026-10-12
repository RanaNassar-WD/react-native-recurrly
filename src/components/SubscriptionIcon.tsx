import { icons as brandIcons } from "@iconify-json/logos";
import { Image, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { icons } from "../../constants/icons";

const normalizeBrandName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const normalizedBrandIcons = Object.entries(brandIcons.icons)
  .map(([slug, icon]) => ({ normalizedSlug: normalizeBrandName(slug), slug, icon }))
  .sort((first, second) => second.normalizedSlug.length - first.normalizedSlug.length);

const brandAliases: Record<string, string> = {
  anghami: "anghami",
  anghamiplus: "anghami",
  youtubemusic: "youtube",
  youtubepremium: "youtube",
};

const anghamiIconXml = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path fill="none" stroke="#081126" stroke-linecap="round" stroke-linejoin="round" d="M35.397 42.23A21.5 21.5 0 0 1 24 45.5C12.126 45.5 2.5 35.874 2.5 24S12.126 2.5 24 2.5S45.5 12.126 45.5 24v19.5"/>
  <path fill="none" stroke="#081126" stroke-linecap="round" stroke-linejoin="round" d="M33.262 39.337A17.9 17.9 0 0 1 24 41.917c-9.895 0-17.917-8.022-17.917-17.917S14.105 6.083 24 6.083S41.917 14.105 41.917 24v18.492"/>
  <path fill="none" stroke="#081126" stroke-linecap="round" stroke-linejoin="round" d="M33.261 34.94a14.33 14.33 0 0 1-9.26 3.394c-7.917 0-14.334-6.418-14.334-14.333S16.085 9.668 24 9.668S38.333 16.085 38.333 24v17.484"/>
  <path fill="none" stroke="#081126" stroke-linecap="round" stroke-linejoin="round" d="M33.266 29.451a10.75 10.75 0 0 1-9.266 5.3c-5.937 0-10.75-4.813-10.75-10.75S18.063 13.25 24 13.25S34.75 18.064 34.75 24v16.476"/>
</svg>`;

export function getSubscriptionIcon(name: string): SubscriptionIconSource {
  const normalizedName = normalizeBrandName(name);
  const aliasSlug = brandAliases[normalizedName];
  const matchedBrand = aliasSlug
    ? aliasSlug
    : normalizedBrandIcons.find((entry) => normalizedName.startsWith(entry.normalizedSlug))?.slug;

  return matchedBrand
    ? { kind: "brand", name: matchedBrand }
    : icons.wallet;
}

function isBrandIcon(icon: SubscriptionIconSource): icon is { kind: "brand"; name: string } {
  return typeof icon === "object" && icon !== null && "kind" in icon && icon.kind === "brand";
}

export default function SubscriptionIcon({
  icon,
}: {
  icon: SubscriptionIconSource;
}) {
  if (isBrandIcon(icon)) {
    if (icon.name === "anghami") {
      return (
        <View className="sub-icon items-center justify-center overflow-hidden bg-white p-2">
          <SvgXml xml={anghamiIconXml} width="100%" height="100%" />
        </View>
      );
    }

    const brand = brandIcons.icons[icon.name];
    if (brand) {
      const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${brand.width} ${brand.height}">${brand.body}</svg>`;
      return (
        <View className="sub-icon items-center justify-center overflow-hidden bg-white p-2">
          <SvgXml xml={xml} width="100%" height="100%" />
        </View>
      );
    }
  }

  return <Image source={isBrandIcon(icon) ? icons.wallet : icon} className="sub-icon" />;
}
