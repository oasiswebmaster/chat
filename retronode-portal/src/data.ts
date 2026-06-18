import { FileSystemNode } from './types';

export const emptyRootFolder: FileSystemNode = {
  id: 'root',
  name: 'Home',
  type: 'folder',
  size: '',
  updatedAt: new Date().toISOString(),
  children: []
};

export const rootFolder: FileSystemNode = {
  id: 'root',
  name: 'Home',
  type: 'folder',
  size: '',
  updatedAt: '2026-05-12 17:55',
  children: [
    {
      id: 'documents',
      name: 'Documents',
      type: 'folder',
      size: '',
      updatedAt: '2026-05-12 17:55',
      children: [
        {
          id: 'board_minutes',
          name: 'Board-Minutes',
          type: 'folder',
          size: '',
          updatedAt: '2026-05-12 17:55',
          children: [
            {
              id: 'jan_2026_minutes',
              name: 'January-13-2026-Board-minutes.pdf',
              type: 'document',
              size: '458.3 KB',
              updatedAt: '2026-05-12 17:55',
              content: 'PDF Document: January-13-2026-Board-minutes.pdf\n[Download request would be routed to http://9.205.155.61/docs/?api=1&action=download&path=Board-Minutes/January-13-2026-Board-minutes.pdf]'
            },
            {
              id: 'sept_2025_minutes',
              name: 'Sept-13-2025-AGM-Minutes.pdf',
              type: 'document',
              size: '136.6 KB',
              updatedAt: '2026-05-12 17:55',
              content: 'PDF Document: Sept-13-2025-AGM-Minutes.pdf\n[Download request would be routed to http://9.205.155.61/docs/?api=1&action=download&path=Board-Minutes/Sept-13-2025-AGM-Minutes.pdf]'
            }
          ]
        },
        {
          id: 'financial_statements',
          name: 'Financial-Statements',
          type: 'folder',
          size: '',
          updatedAt: '2026-05-29 22:40',
          children: []
        },
        {
          id: 'forms',
          name: 'Forms',
          type: 'folder',
          size: '',
          updatedAt: '2026-05-12 17:55',
          children: [
            { id: 'form_non_paying', name: 'Oasis-Form-for-Non-Paying-Guests-Fillable.pdf', type: 'document', size: '821.8 KB', updatedAt: '2026-05-12 17:55', content: 'PDF Document preview' },
            { id: 'form_renters', name: 'Oasis-Form-for-Renters-Fillable.pdf', type: 'document', size: '809.8 KB', updatedAt: '2026-05-12 17:55', content: 'PDF Document preview' },
            { id: 'dev_permit_1', name: 'Development-Permit-and-Process-2019-Fillable-1.pdf', type: 'document', size: '686.3 KB', updatedAt: '2026-05-12 17:55', content: 'PDF Document preview' },
            { id: 'tree_app', name: 'Tree-Application-2019-Fillable.pdf', type: 'document', size: '645.5 KB', updatedAt: '2026-05-12 17:55', content: 'PDF Document preview' },
            { id: 'dev_permit_0', name: 'Development-Permit-and-Process-2019-Fillable.pdf', type: 'document', size: '139.9 KB', updatedAt: '2026-05-12 17:55', content: 'PDF Document preview' },
            { id: 'buoy_rental', name: 'Oasis-RV-Resort-Buoy-Rental-Waiver-Form.pdf', type: 'document', size: '37.3 KB', updatedAt: '2026-05-12 17:55', content: 'PDF Document preview' }
          ]
        },
        {
          id: 'insurance',
          name: 'Insurance',
          type: 'folder',
          size: '',
          updatedAt: '2026-05-12 17:55',
          children: [
            { id: 'financial_2026', name: 'Q1_Financial_Report.xlsx', type: 'document', size: '1.2 MB', updatedAt: '2026-05-12 17:55', content: 'Excel Spreadsheet preview' },
            { id: 'presentation_2026', name: 'Annual_Shareholder_Meeting.pptx', type: 'document', size: '4.5 MB', updatedAt: '2026-05-12 17:55', content: 'PowerPoint Presentation preview' },
            { id: 'welcome_guide', name: 'New_Resident_Welcome_Guide.docx', type: 'document', size: '2.1 MB', updatedAt: '2026-05-12 17:55', content: 'Word Document preview' },
            { id: 'archive_2025', name: '2025_Archive_Backup.zip', type: 'document', size: '145 MB', updatedAt: '2026-05-12 17:55', content: 'Archive file' },
            { id: 'oasis_q1', name: 'Oasis.Q1.2026.pdf', type: 'document', size: '583.2 KB', updatedAt: '2026-05-12 17:55', content: 'PDF Document preview' },
            { id: 'oasis_q2', name: 'Oasis.Q2.NTR_.pdf', type: 'document', size: '178.6 KB', updatedAt: '2026-05-12 17:55', content: 'PDF Document preview' }
          ]
        },
        {
          id: 'htaccess',
          name: '.htaccess',
          type: 'unknown',
          size: '98 B',
          updatedAt: '2026-05-12 17:31',
          content: 'Server config file. Direct access restricted.'
        }
      ]
    },
    {
      id: 'images',
      name: 'Images',
      type: 'folder',
      size: '',
      updatedAt: '2026-05-12 17:55',
      children: [
         { id: 'cover_img', name: 'Resort_Cover.jpg', type: 'image', size: '2.4 MB', updatedAt: '2026-05-12 17:55', content: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=1000' }
      ]
    },
    {
      id: 'video',
      name: 'Video',
      type: 'folder',
      size: '',
      updatedAt: '2026-05-12 17:55',
      children: [
        { id: 'resort_tour_2026', name: 'Oasis_Resort_Tour_Spring_2026.mp4', type: 'document', size: '245.5 MB', updatedAt: '2026-05-12 17:55', content: 'Video preview placeholder' },
        { id: 'drone_shots', name: 'Drone_Footage_Lake.mov', type: 'document', size: '890.1 MB', updatedAt: '2026-05-12 17:55', content: 'Video preview placeholder' }
      ]
    }
  ]
};

