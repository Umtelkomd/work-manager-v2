// Project definitions — seeded data
const PROJECT_SEED = {
    clients: [
        { id: 'INS', name: 'Insyte Deutschland' },
        { id: 'VAN', name: 'Vancom IT' }
    ],
    operators: [
        { id: 'DGF', name: 'Deutsche Glasfaser', clientId: 'INS' },
        { id: 'GFP', name: 'Glasfaser Plus', clientId: 'INS' },
        { id: 'UGG', name: 'UGG/Vescon', clientId: 'VAN' }
    ],
    projects: [
        { code: 'HXT', name: 'Höxter Nord', clientId: 'INS', operatorId: 'DGF', lines: ['NE3', 'NE4'], status: 'active' },
        { code: 'RSD', name: 'Roßdorf', clientId: 'INS', operatorId: 'DGF', lines: ['NE3', 'NE4'], status: 'active' },
        { code: 'WCB', name: 'Westconnect Bielefeld', clientId: 'INS', operatorId: 'DGF', lines: ['NE3', 'NE4'], status: 'active' },
        { code: 'QFF', name: 'QFF Roßdorf', clientId: 'INS', operatorId: 'GFP', lines: ['NE4'], status: 'active' },
        { code: 'WRZ', name: 'GF+ Würzburg', clientId: 'INS', operatorId: 'GFP', lines: ['NE4'], status: 'active' },
        { code: 'EHR', name: 'Ehrenkirchen', clientId: 'VAN', operatorId: 'UGG', lines: ['NE4'], status: 'active' }
    ],
    teams: [
        { id: 'WEST-001', name: 'West-001', members: ['Carlos M.', 'Diego R.', 'Felipe S.'] },
        { id: 'WEST-002', name: 'West-002', members: ['Andrés L.', 'Jorge P.', 'Manuel T.'] },
        { id: 'WEST-003', name: 'West-003', members: ['Ricardo G.', 'Pablo V.'] },
        { id: 'WEST-004', name: 'West-004', members: ['Oscar H.', 'Luis C.'] },
        { id: 'PLUS-001', name: 'Plus-001', members: ['Mario D.', 'Sergio A.', 'Tomás B.'] }
    ]
};
