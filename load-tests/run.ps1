param(
  [Parameter(Mandatory = $true)]
  [string]$ShortCode,
  [string]$BaseUrl = "http://host.docker.internal:3000",
  [int]$Rate = 50,
  [int]$Vus = 10,
  [int]$MaxVus = 100,
  [string]$Duration = "30s"
)

$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
  throw "Docker is required to run the k6 load test. Install Docker Desktop and try again."
}

docker run --rm `
  -v "${PWD}:/work" `
  -w /work `
  grafana/k6 run /work/load-tests/redirects.js `
  -e "BASE_URL=$BaseUrl" `
  -e "SHORT_CODE=$ShortCode" `
  -e "RATE=$Rate" `
  -e "VUS=$Vus" `
  -e "MAX_VUS=$MaxVus" `
  -e "DURATION=$Duration"

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}