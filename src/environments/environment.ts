export const environment = {
    production: false,
    domain: 'http://localhost:5073/api',
    languages: ['en', 'mk'],
    permissionId: {
        table: {
            view: 93,
            addAndEdit: 92,
            delete: 96
        },
        product: {
            view: 82,
            addAndEdit: 81,
            delete: 85
        },
        category: {
            view: 67,
            addAndEdit: 66,
            delete: 70
        },
        organization: {
            view: 77,
            addAndEdit: 76,
            delete: 80
        },
        staffUser: {
            view: 87,
            addAndEdit: 86,
            delete: 90
        },
        role: {
            view: 57,
            addAndEdit: 56,
            delete: 60
        },
        tableItem: {
            view: 98,
            addAndEdit: 97,
            delete: 101
        },
        transaction: {
            view: 103,
            addAndEdit: 102,
            delete: 106
        },
        transactionItem: {
            view: 108,
            addAndEdit: 107,
            delete: 111
        },
        location: {
            view: 72,
            addAndEdit: 71,
            delete: 75
        },
    }
}