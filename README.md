# ⚡️ 이벤트 기반 배치 카프카 시스템 - 프론트엔드 (Event-Driven Batch Kafka System - Frontend)

## 🚀 프로젝트 소개

이 프로젝트는 `Event-Driven Batch Kafka System`의 프론트엔드 부분으로, 카프카(Kafka) 파티션 개수가 시스템의 성능(처리량, 지연 시간)에 미치는 영향을 시각적으로 분석하고 비교할 수 있는 대시보드를 제공합니다. 백엔드 시스템과 연동하여 실시간 모니터링, 배치 작업 관리, 로드 테스트 실행 및 결과 분석 기능을 수행합니다.

### 주요 기능
*   **카프카 파티션 트레이드오프 분석:** 1개, 4개 등의 다양한 파티션 개수에 따른 시스템 성능 변화를 로드 테스트를 통해 비교하고 시각화합니다.
*   **실시간 모니터링 대시보드:** 백엔드에서 처리되는 이벤트 및 시스템 상태를 실시간으로 모니터링합니다.
*   **배치 작업 관리:** 배치 작업의 생성, 실행, 상태 조회 및 관리가 가능합니다.
*   **로드 테스트 및 결과 분석:** 시스템의 부하 테스트를 실행하고, 그 결과를 상세한 그래프와 지표로 분석합니다.
*   **캠페인 관리:** 사용자 캠페인 생성 및 상태를 관리합니다.
*   **사용자 참여 확인:** 캠페인 참여 이력을 확인합니다.

## 🛠️ 기술 스택

*   **프론트엔드:**
    *   **프레임워크:** React (with Vite)
    *   **언어:** TypeScript
    *   **스타일링:** Material-UI (MUI)
    *   **API 통신:** Axios
    *   **차트/그래프:** Recharts
*   **백엔드 (연동 대상):**
    *   **이벤트 스트리밍:** Apache Kafka
    *   **로드 밸런서:** AWS Application Load Balancer (ALB)
    *   (기타 백엔드 기술 스택은 백엔드 프로젝트 README 참조)

## 💻 프로젝트 시작하기

### ⚙️ 환경 설정

이 프로젝트는 Node.js (v18 이상 권장) 및 npm (또는 yarn)이 설치되어 있어야 합니다.

1.  **리포지토리 클론:**
    ```bash
    git clone [리포지토리_주소]
    cd event-driven-batch-kafka-system_FE
    ```

2.  **의존성 설치:**
    ```bash
    npm install
    # 또는 yarn install
    ```

3.  **환경 변수 설정:**
    `.env.production` 파일을 생성하고 백엔드 API의 ALB DNS 주소를 다음과 같이 설정합니다.
    ```env
    VITE_API_BASE_URL=http://your-alb-dns-name.elb.amazonaws.com
    ```
    (예: `http://alb-batch-kafka-api-1351817547.ap-northeast-2.elb.amazonaws.com`)

### 🚀 개발 서버 실행

```bash
npm run dev
```
개발 서버가 `http://localhost:5173`에서 실행됩니다. 개발 환경에서는 `vite.config.ts`에 설정된 프록시를 통해 백엔드 API(`localhost:8080` 기준)와 통신합니다.

### 📦 프로덕션 빌드

프로덕션 배포를 위한 빌드를 생성합니다.

```bash
npm run build
```
빌드된 결과물은 `dist` 폴더에 생성됩니다. 이 폴더의 내용을 웹 서버에 배포하면 됩니다.

**참고:**
*   `tsc -b` 타입 검사를 포함한 빌드를 원한다면 `npm run build:check`를 사용하세요.
*   MUI v7 Grid 컴포넌트 타입 정의 이슈로 인해 `build` 스크립트에서는 타입 검사를 생략합니다.

### 🧪 프로덕션 빌드 미리보기

빌드된 프로덕션 버전을 로컬에서 미리 볼 수 있습니다.

```bash
npm run preview
```
미리보기 서버는 `http://localhost:4173`에서 실행되며, `.env.production` 파일에 설정된 `VITE_API_BASE_URL`을 사용하여 백엔드와 통신합니다.

## 📈 카프카 파티션 트레이드오프 테스트 방법

1.  백엔드 시스템이 가동 중인지 확인합니다. (Kafka, EC2 인스턴스, ALB 등)
2.  프론트엔드 개발 서버(`npm run dev`) 또는 프로덕션 빌드 미리보기(`npm run preview`)를 실행합니다.
3.  프론트엔드 애플리케이션의 **관리자 페이지 (Admin Page) 내 `PerformanceTest` 또는 `LoadTest` 관련 메뉴**로 이동합니다.
4.  UI를 통해 파티션 개수 (예: 1개, 4개)를 선택하고 부하 테스트를 실행합니다.
5.  **`LoadTestResults` 또는 `StatsDashboard` 메뉴**에서 테스트 결과를 확인하고, 파티션 개수에 따른 시스템 성능 변화를 비교 분석합니다.

## 🤝 기여

프로젝트 기여에 대한 내용은 백엔드 프로젝트 또는 별도의 기여 가이드라인을 참조해주세요.