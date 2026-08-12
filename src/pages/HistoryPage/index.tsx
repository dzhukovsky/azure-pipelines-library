import { Header, TitleSize } from 'azure-devops-ui/Header';
import { Page } from 'azure-devops-ui/Page';
import { Surface, SurfaceBackground } from 'azure-devops-ui/Surface';
import { HistoryContent } from '@/features/history/components/HistoryContent';

export const HistoryPage = () => (
  <Surface background={SurfaceBackground.neutral}>
    <Page className="height-100vh flex-grow">
      <Header title="Library History" titleSize={TitleSize.Large} />
      <div className="page-content page-content-top">
        <HistoryContent />
      </div>
    </Page>
  </Surface>
);
