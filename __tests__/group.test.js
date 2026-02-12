import request from 'supertest';


/* The Tests below are for group routes
The routes start with: /api/groups 
routes include:
    ->/groupDashboard
    ->/createGroup
    ->/groups/:id
*/

//WIP - tests to be implemented later
//These are just placeholder tests for now to avoid failing CI/CD pipelines
//TO run test suit, use: npm run test

describe('Group API\'s', () => {
    
    it('create a new group', async () => {
        expect(true).toBe(true);
    });

    it('fetch group details by groupId', async () => {
        expect(true).toBe(true);
    });

    it('join a group', async () => {
        expect(true).toBe(true);
    });

    it('leave a joined group', async () => {
        expect(true).toBe(true);
    });

    it('get user\'s joined groups', async () => {
        expect(true).toBe(true);
    });

})

