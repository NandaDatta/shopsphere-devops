output "vpc_id" {

  description = "ShopSphere VPC ID"
  value       = aws_vpc.shopsphere_vpc.id

}

output "vpc_cidr" {

  description = "ShopSphere VPC CIDR block"
  value       = aws_vpc.shopsphere_vpc.cidr_block

}

output "internet_gateway_id" {
  description = "ShopSphere Internet Gateway ID"
  value       = aws_internet_gateway.shopsphere_igw.id
}
