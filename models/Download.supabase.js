'use strict'

const TABLE = 'downloads'

class Download {
    static findAll () {
        return process.supabase.from(TABLE).select('*').limit(5).order('count', {
            ascending: false
        }).then(r => r.data)
    }

    static findOrCreate (publication_id) {
        return new Promise((resolve) => {
            Download.findOne(publication_id).then(({ count }) => {
                resolve(process.supabase.from(TABLE).update({
                    count: parseInt(count ?? 0) + 1
                }).eq('publication_id', publication_id)).then((res) => res.data)
            })
        })
    }

    static create ({ publication_id, count }) {
        return process.supabase.from(TABLE).insert({
            publication_id,
            count: parseInt(count ?? 0)
        }).then((res) => res.data?.[0])
    }

    static findOne (publication_id) {
        return new Promise((resolve) => {
            process.supabase.from(TABLE).select('*').eq('publication_id', publication_id).then(
                (publication) => {
                    resolve(publication.data?.[0] ?? {
                        publication_id: publication_id,
                        count: 0
                    })
                }
            )
        })
    }

    static async update (publication_id, count = 0) {
        let downloadCount = parseInt(count)
        if (!downloadCount) {
            downloadCount = (await Download.findOne(publication_id)).count
        }
        return process.supabase.from(TABLE).upsert({
            publication_id,
            count: downloadCount + 1
        }, { onConflict: 'publication_id' }).then(res => res.data?.[0])
    }

    static uploadFromJson ({ rows }) {
        rows.forEach((row) => {
            const [ id, publication_id, count ] = row
            // Ignore publications with 0 downloads
            if (publication_id && !!Number(count)) {
                Download.update(publication_id, count)
            }
        })
    }
}

module.exports = Download
