import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Reader } from '@maxmind/geoip2-node';

function bundledDatabasePath(name) {
  const entry = fileURLToPath(import.meta.resolve('@maxminddatabase/geolite2'));
  return path.join(path.dirname(path.dirname(entry)), 'database', name);
}

export function resolveDatabasePaths(env = process.env) {
  return {
    city: path.resolve(env.MAXMIND_CITY_DB || bundledDatabasePath('GeoLite2-City.mmdb')),
    asn: path.resolve(env.MAXMIND_ASN_DB || bundledDatabasePath('GeoLite2-ASN.mmdb'))
  };
}

function localizedName(record) {
  return record?.names?.['zh-CN'] || record?.names?.en || '未知';
}

function asName(organization = '') {
  return organization.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function createMaxMindService({ cityPath, asnPath } = {}) {
  const paths = resolveDatabasePaths();
  const resolvedCity = cityPath || paths.city;
  const resolvedAsn = asnPath || paths.asn;

  for (const database of [resolvedCity, resolvedAsn]) {
    if (!fs.existsSync(database)) throw new Error(`MaxMind database not found: ${database}`);
  }

  const [cityReader, asnReader] = await Promise.all([
    Reader.open(resolvedCity),
    Reader.open(resolvedAsn)
  ]);

  return {
    paths: { city: resolvedCity, asn: resolvedAsn },
    lookup(ip) {
      let city;
      let asn;
      try { city = cityReader.city(ip); } catch {}
      try { asn = asnReader.asn(ip); } catch {}

      const organization = asn?.autonomousSystemOrganization || '未知';
      const countryCode = city?.country?.isoCode || city?.registeredCountry?.isoCode || '';
      const subdivision = city?.subdivisions?.[0];
      return {
        city: localizedName(city?.city),
        postalCode: city?.postal?.code || '未知',
        region: localizedName(subdivision),
        countryCode,
        country: localizedName(city?.country || city?.registeredCountry),
        timezone: city?.location?.timeZone || '未知',
        latitude: city?.location?.latitude,
        longitude: city?.location?.longitude,
        accuracyRadius: city?.location?.accuracyRadius,
        network: city?.traits?.network || asn?.network || '未知',
        asn: asn?.autonomousSystemNumber,
        asnName: asName(organization),
        provider: organization
      };
    }
  };
}
